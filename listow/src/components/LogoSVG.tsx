import React from 'react';
import { View, StyleSheet, Image } from 'react-native';

interface LogoSVGProps {
  width?: number;
  height?: number;
}

const LogoSVG: React.FC<LogoSVGProps> = ({ width = 48, height = 48 }) => {
  return (
    <View style={[styles.container, { width, height }]}>
      <Image 
        source={require('../../assets/icon.png')} 
        style={[styles.image, { width, height }]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  image: {
    backgroundColor: 'transparent',
  },
});

export default LogoSVG;
