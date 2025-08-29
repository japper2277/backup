import React from 'react';
import styled from '@emotion/styled';
import { theme, getStatusColor } from '../../styles/theme';

// Styled Pill component
const StyledPill = styled.span`
  background-color: ${props => props.backgroundColor || getStatusColor(props.color)};
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.pill};
  font-size: 0.7rem;
  font-weight: 600;
  color: white;
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  transition: all ${theme.transitions.fast};
  
  /* Hover effect */
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;

export const Pill = ({ children, color, backgroundColor, icon }) => {
  return (
    <StyledPill color={color} backgroundColor={backgroundColor}>
      {icon && <i className={icon} />}
      {children}
    </StyledPill>
  );
};

// Specialized pill components for common use cases
export const StatusPill = ({ status }) => (
  <Pill color={status}>{status}</Pill>
);

export const JokeTypePill = ({ type }) => (
  <Pill backgroundColor={theme.colors.accent.purple}>{type}</Pill>
);

export const CleanPill = () => (
  <Pill backgroundColor={theme.colors.accent.green}>Clean</Pill>
);