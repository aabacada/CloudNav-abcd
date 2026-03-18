import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

const Icon: React.FC<IconProps> = ({ name, size = 20, className }) => {
  // @ts-ignore - Dynamic access to Lucide icons
  const IconComponent = LucideIcons[name] || LucideIcons.Link;
  return <IconComponent size={size} className={className} />;
};
export default Icon;
