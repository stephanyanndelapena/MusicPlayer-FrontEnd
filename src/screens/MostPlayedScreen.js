import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { getMostPlayed, getAllPlayCounts, clearPlayCounts } from '../utils/playCounts';
import styles, { colors } from './MostPlayedScreen.styles';
import { SvgXml } from 'react-native-svg';

const BOOTSTRAP_ICONS_BASE = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/icons';
const ARROW_CLOCKWISE = `${BOOTSTRAP_ICONS_BASE}/arrow-clockwise.svg`;
const TRASH3_FILL = `${BOOTSTRAP_ICONS_BASE}/trash3-fill.svg`;

const svgCache = {};
function RemoteSvgIcon({ uri, color = '#fff', width = 16, height = 16, style }) {
  const [svgText, setSvgText] = useState(null);

  React.useEffect(() => {
    let mounted = true;
    if (svgCache[uri]) {
      setSvgText(svgCache[uri]);
      return;
    }
    fetch(uri)
      .then((res) => res.text())
      .then((text) => {
        if (!mounted) return;
        svgCache[uri] = text;
        setSvgText(text);
      })
      .catch((err) => {
        console.warn('Failed to load SVG', uri, err);
      });
    return () => {
      mounted = false;
    };
  }, [uri]);

  if (!svgText) return <View style={[{ width, height }, style]} />;

  const colored = svgText
    .replace(/fill="[^"]*"/gi, `fill="${color}"`)
    .replace(/stroke="[^"]*"/gi, `stroke="${color}"`)
    .replace(/fill='[^']*'/gi, `fill="${color}"`)
    .replace(/stroke='[^']*'/gi, `stroke="${color}"`);

  return <SvgXml xml={colored} width={width} height={height} style={style} />;
}

function IconButton({
  uri,
  onPress,
  size = 18,
  baseStyle,
  hoverStyle,
  iconColor = colors.textPrimary,
  hoverIconColor = colors.textPrimary,
  accessibilityLabel,
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => {
        const active = pressed || hovered;
        return [baseStyle, active ? hoverStyle : null];
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {({ pressed }) => {
        const active = pressed || hovered;
        return <RemoteSvgIcon uri={uri} color={active ? hoverIconColor : iconColor} width={size} height={size} />;
      }}
    </Pressable>
  );
}

export default function MostPlayedScreen({ navigation }) {
  const [top, setTop] = useState(null);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredTrackId, setHoveredTrackId] = useState(null);

  const sameTrack = (a, b) => {
    if (!a || !b) return false;
    if (a.id != null && b.id != null) return String(a.id) === String(b.id);
    const ta = (a.title || a.name || '').trim().toLowerCase();
    const tb = (b.title || b.name || '').trim().toLowerCase();
    const aa = (a.artist || a.author || '').trim().toLowerCase();
    const ab = (b.artist || b.author || '').trim().toLowerCase();
    return ta && ta === tb && aa && aa === ab;
  };

  const load = async () => {
    setLoading(true);
    try {
      const t = await getMostPlayed();
      let a = await getAllPlayCounts();

      if (t) {
        a = (a || []).filter((item) => !sameTrack(item, t));
      }

      setTop(t);
      setAll(a || []);
    } catch (err) {
      console.warn('MostPlayed load error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    navigation.setOptions({
      title: 'Most Played Track',
      headerStyle: {
        backgroundColor: colors.background || '#121212',
        borderBottomWidth: 0,
        borderBottomColor: 'transparent',
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: colors.textPrimary || '#fff',
      headerTitleStyle: { color: colors.textPrimary || '#fff' },
    });

    load();
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!top) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>No plays recorded yet.</Text>
        <View style={styles.spacer12} />
        <View style={styles.centeredControls}>
          <IconButton
            uri={ARROW_CLOCKWISE}
            onPress={load}
            baseStyle={styles.refreshButton}
            hoverStyle={styles.refreshHover}
            iconColor={colors.textPrimary}
            hoverIconColor={colors.textPrimary}
            size={20}
            accessibilityLabel="Refresh"
          />

          
          <IconButton
            uri={TRASH3_FILL}
            onPress={async () => {
              await clearPlayCounts();
              await load();
            }}
            baseStyle={styles.clearButton}
            hoverStyle={styles.clearHover}
            iconColor={colors.danger}
            hoverIconColor={'#fff'}
            size={20}
            accessibilityLabel="Clear play counts"
          />
        </View>
      </View>
    );
  }

  function RemoteImage({ uri, style, placeholderStyle, resizeMode = 'cover' }) {
    const [errored, setErrored] = useState(false);
    const safeUri = uri || null;

    React.useEffect(() => {
      setErrored(false);
    }, [uri]);

    if (!safeUri || errored) {
      return <View style={[styles.thumbPlaceholder, placeholderStyle]} />;
    }

    return (
      <Image
        source={{ uri: safeUri }}
        style={style}
        resizeMode={resizeMode}
        onError={(e) => {
          console.warn('[RemoteImage] onError', e.nativeEvent, safeUri);
          setErrored(true);
        }}
      />
    );
  }

  const renderItem = ({ item }) => {
    const id = item?.id ?? String(item?.title ?? Math.random());
    const isHovered = hoveredTrackId === id;

    return (
      <Pressable
        onHoverIn={() => setHoveredTrackId(id)}
        onHoverOut={() => setHoveredTrackId(null)}
        onPress={() => {}}
        style={[styles.row, isHovered ? styles.rowHover : null]}
        accessibilityRole="button"
      >
        <RemoteImage uri={item.artwork} style={styles.thumb} placeholderStyle={styles.thumbPlaceholder} />
        <View style={styles.rowText}>
          <Text style={styles.title}>{item.title || '(unknown)'}</Text>
          <Text style={styles.subtitle}>{item.artist || ''}</Text>
          <Text style={styles.count}>Plays: {item.count || 0}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Top Track</Text>

      <View style={styles.topCard}>
        <RemoteImage uri={top.artwork} style={styles.topArt} placeholderStyle={styles.topArtPlaceholder} resizeMode="cover" />
        <Text style={styles.topTitle}>{top.title || '(unknown)'}</Text>
        <Text style={styles.topArtist}>{top.artist || ''}</Text>
        <Text style={styles.topCount}>Plays: {top.count || 0}</Text>

        <View style={styles.topCardControls} pointerEvents="box-none">
          <IconButton
            uri={ARROW_CLOCKWISE}
            onPress={load}
            baseStyle={styles.topIconButton}
            hoverStyle={styles.topIconHover}
            iconColor={colors.textPrimary}
            hoverIconColor={colors.textPrimary}
            size={20}
            accessibilityLabel="Refresh"
          />

          <IconButton
            uri={TRASH3_FILL}
            onPress={async () => {
              await clearPlayCounts();
              await load();
            }}
            baseStyle={styles.topClearButton}
            hoverStyle={styles.topClearHover}
            iconColor={colors.danger}
            hoverIconColor={'#fff'}
            size={20}
            accessibilityLabel="Clear play counts"
          />
        </View>
      </View>

      <View style={styles.spacer12} />

      <Text style={styles.heading}>Other Tracks</Text>
      <FlatList
        data={all}
        keyExtractor={(i, idx) => String(i?.id ?? idx)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}