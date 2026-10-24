import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, AppState, Easing, Pressable } from "react-native";
import { Image } from "expo-image";
import { useIsFocused } from "@react-navigation/native";

export default function PuppyMascot() {
  const idle = useRef(new Animated.Value(0)).current;
  const jump = useRef(new Animated.Value(0)).current;
  const hopping = useRef(false);
  const [reduced, setReduced] = useState(true);
  const [active, setActive] = useState(AppState.currentState === "active");
  const focused = useIsFocused();
  const moving = focused && active && !reduced;

  useEffect(() => {
    let alive = true;
    let changed = false;
    const motion = AccessibilityInfo.addEventListener("reduceMotionChanged", value => {
      changed = true;
      setReduced(value);
    });
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (alive && !changed) setReduced(value);
    }).catch(() => {});
    const state = AppState.addEventListener("change", value => setActive(value === "active"));
    return () => { alive = false; motion.remove(); state.remove(); };
  }, []);

  useEffect(() => {
    if (!moving) return;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(idle, { toValue: 1, duration: 2300, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
      Animated.timing(idle, { toValue: 0, duration: 2300, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
    ]));
    animation.start();
    return () => {
      animation.stop(); jump.stopAnimation(); idle.setValue(0); jump.setValue(0); hopping.current = false;
    };
  }, [moving, idle, jump]);

  function hop() {
    if (!moving || hopping.current) return;
    hopping.current = true;
    Animated.sequence([
      Animated.timing(jump, { toValue: -13, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true, isInteraction: false }),
      Animated.spring(jump, { toValue: 0, friction: 4, tension: 90, useNativeDriver: true, isInteraction: false }),
    ]).start(() => { hopping.current = false; });
  }

  return (
    <Pressable onPress={hop} accessibilityRole="button" accessibilityLabel="子犬と遊ぶ" hitSlop={4}>
      <Animated.View style={{ transform: [
        { translateY: Animated.add(idle.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }), jump) },
        { rotate: idle.interpolate({ inputRange: [0, .5, 1], outputRange: ["0deg", "-3deg", "3deg"] }) },
      ] }}>
        <Image source={require("@/assets/images/seoulmono-puppy.png")} style={{ width: 44, height: 44 }} contentFit="contain" />
      </Animated.View>
    </Pressable>
  );
}
