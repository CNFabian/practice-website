import React from 'react'

interface RobotoFontProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  weight?: 400 | 500 | 600 | 700
  className?: string
  as?: keyof JSX.IntrinsicElements
}

const RobotoFont: React.FC<RobotoFontProps> = ({
  children,
  style,
  weight = 400,
  className = '',
  as: Component = 'span',
  ...rest
}) => {
  return React.createElement(
    Component,
    {
      className,
      style: {
        fontFamily: 'Roboto, sans-serif',
        fontWeight: weight,
        ...style, // spread any incoming inline styles
      },
      ...rest
    },
    children
  )  
}

export default RobotoFont

