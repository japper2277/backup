import styled from '@emotion/styled';
import { theme } from '../../styles/theme';

// Base Button component with variants
export const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.xs};
  padding: ${props => props.size === 'small' ? `${theme.spacing.xs} ${theme.spacing.sm}` : `${theme.spacing.md} ${theme.spacing.lg}`};
  font-size: ${props => props.size === 'small' ? '0.8rem' : '0.9rem'};
  font-weight: 600;
  border: none;
  border-radius: ${theme.borderRadius.md};
  cursor: pointer;
  transition: all ${theme.transitions.normal};
  font-family: ${theme.fonts.sans};
  
  /* Disabled state */
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
  
  /* Focus state */
  &:focus {
    outline: 2px solid ${theme.colors.accent.blue};
    outline-offset: 2px;
  }
  
  /* Variant styles */
  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: ${theme.colors.accent.green};
          color: white;
          &:hover:not(:disabled) {
            background: #1aa34a;
            transform: translateY(-1px);
          }
        `;
      case 'secondary':
        return `
          background: ${theme.colors.bg.surface2};
          color: ${theme.colors.text.primary};
          border: 1px solid ${theme.colors.border};
          &:hover:not(:disabled) {
            background: ${theme.colors.bg.surface};
          }
        `;
      case 'danger':
        return `
          background: ${theme.colors.accent.red};
          color: white;
          &:hover:not(:disabled) {
            background: #dc2626;
            transform: translateY(-1px);
          }
        `;
      case 'ghost':
        return `
          background: transparent;
          color: ${theme.colors.text.secondary};
          &:hover:not(:disabled) {
            background: ${theme.colors.bg.surface};
            color: ${theme.colors.text.primary};
          }
        `;
      default:
        return `
          background: ${theme.colors.accent.blue};
          color: white;
          &:hover:not(:disabled) {
            background: #3b82f6;
            transform: translateY(-1px);
          }
        `;
    }
  }}
`;

// Specialized button components
export const PrimaryButton = styled(Button)`
  background: ${theme.colors.accent.green};
  color: white;
`;

export const DangerButton = styled(Button)`
  background: ${theme.colors.accent.red};
  color: white;
`;

export const IconButton = styled(Button)`
  padding: ${theme.spacing.sm};
  width: auto;
  height: auto;
  min-width: 32px;
  border-radius: ${theme.borderRadius.sm};
`;