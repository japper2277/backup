import styled from '@emotion/styled';
import { theme } from '../../styles/theme';

// Form components using the theme system
export const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

export const FormLabel = styled.label`
  display: block;
  color: ${theme.colors.text.secondary};
  font-size: 0.9rem;
  font-weight: 500;
`;

export const FormInput = styled.input`
  width: 100%;
  background: ${theme.colors.bg.input};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  color: ${theme.colors.text.primary};
  font-size: 1rem;
  font-family: ${theme.fonts.sans};
  transition: all ${theme.transitions.normal};
  
  &::placeholder {
    color: ${theme.colors.text.secondary};
  }
  
  &:focus {
    outline: none;
    border-color: ${theme.colors.accent.blue};
    box-shadow: 0 0 0 3px rgba(69, 163, 255, 0.1);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const FormTextarea = styled.textarea`
  width: 100%;
  background: ${theme.colors.bg.input};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  color: ${theme.colors.text.primary};
  font-size: 1rem;
  font-family: ${theme.fonts.sans};
  transition: all ${theme.transitions.normal};
  resize: vertical;
  min-height: 100px;
  
  &::placeholder {
    color: ${theme.colors.text.secondary};
  }
  
  &:focus {
    outline: none;
    border-color: ${theme.colors.accent.blue};
    box-shadow: 0 0 0 3px rgba(69, 163, 255, 0.1);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const FormSelect = styled.select`
  width: 100%;
  background: ${theme.colors.bg.surface2};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  color: ${theme.colors.text.primary};
  font-size: 1rem;
  font-family: ${theme.fonts.sans};
  cursor: pointer;
  transition: all ${theme.transitions.normal};
  
  &:focus {
    outline: none;
    border-color: ${theme.colors.accent.blue};
    box-shadow: 0 0 0 3px rgba(69, 163, 255, 0.1);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  /* Style the options */
  option {
    background: ${theme.colors.bg.surface2};
    color: ${theme.colors.text.primary};
  }
`;

export const FormCheckbox = styled.input`
  width: 18px;
  height: 18px;
  accent-color: ${theme.colors.accent.green};
  cursor: pointer;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing.lg};
  margin-top: ${theme.spacing.xl};
  
  @media (max-width: 480px) {
    flex-direction: column-reverse;
    
    button {
      width: 100%;
    }
  }
`;