import { useSchoolTheme } from '../contexts/SchoolThemeContext';

export function useThemeColors() {
  const { theme } = useSchoolTheme();
  return {
    primary: theme.primaryColor,
    secondary: theme.secondaryColor,
    primaryLight: theme.primaryColor + '20',
    primaryBorder: theme.primaryColor + '40',
    buttonStyle: {
      backgroundColor: theme.primaryColor,
      borderRadius: 8,
      padding: 14,
    },
    headerStyle: {
      backgroundColor: theme.primaryColor,
    },
  };
}
