import React from 'react';
import Logo from '../../assets/logo.svg';

interface LogoSVGProps {
  width?: number;
  height?: number;
}

const LogoSVG: React.FC<LogoSVGProps> = ({ width = 100, height = 100 }) => {
  return <Logo width={width} height={height} />;
};

export default LogoSVG;
