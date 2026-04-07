import { useMantineColorScheme } from '@mantine/core'

export function useAppColors() {
  const { colorScheme } = useMantineColorScheme()
  const dark = colorScheme === 'dark'

  return {
    dark,

    // Fondos de layout
    mainBg:       dark ? '#111116' : '#f4f6fa',
    cardBg:       dark ? '#1c1c22' : '#ffffff',
    cardHeaderBg: dark ? '#18181f' : '#f9fafb',
    cardBorder:   dark ? '#2c2c38' : '#e4e8ee',
    sidebarBg:    dark ? '#16161c' : '#ffffff',
    sidebarBorder:dark ? '#26262f' : '#e4e8ee',
    headerBg:     dark ? '#1c1c22' : '#ffffff',
    headerBorder: dark ? '#2c2c38' : '#e4e8ee',

    // Texto
    textPrimary:   dark ? '#f0f0f7' : '#0f1117',
    textSecondary: dark ? '#9898b8' : '#374155',
    textMuted:     dark ? '#5a5a78' : '#6b7280',
    textSubtle:    dark ? '#42425a' : '#9ca3af',
    textLabel:     dark ? '#9898b8' : '#374155',

    // Borders
    border:  dark ? '#2c2c38' : '#e4e8ee',
    divider: dark ? '#26262f' : '#eaecf2',

    // Inputs
    inputBg:     dark ? '#111116' : '#f8f9fc',
    inputBorder: dark ? '#2c2c38' : '#d8dde8',
    inputColor:  dark ? '#f0f0f7' : '#0f1117',

    // Status semánticos
    success: {
      color:  dark ? '#34d399' : '#059669',
      bg:     dark ? 'rgba(52,211,153,0.10)'  : '#f0fdf4',
      border: dark ? 'rgba(52,211,153,0.22)'  : '#d1fae5',
      text:   dark ? '#6ee7b7' : '#065f46',
    },
    warning: {
      color:  dark ? '#fbbf24' : '#d97706',
      bg:     dark ? 'rgba(251,191,36,0.10)'  : '#fffbeb',
      border: dark ? 'rgba(251,191,36,0.22)'  : '#fef3c7',
      text:   dark ? '#fcd34d' : '#78350f',
    },
    danger: {
      color:  dark ? '#fb923c' : '#ea580c',
      bg:     dark ? 'rgba(251,146,60,0.10)'  : '#fff7ed',
      border: dark ? 'rgba(251,146,60,0.22)'  : '#fed7aa',
      text:   dark ? '#fdba74' : '#7c2d12',
    },
    info: {
      color:  dark ? '#60a5fa' : '#2563eb',
      bg:     dark ? 'rgba(96,165,250,0.10)'  : '#eff6ff',
      border: dark ? 'rgba(96,165,250,0.22)'  : '#bfdbfe',
      text:   dark ? '#93c5fd' : '#1e3a8a',
    },
    violet: {
      color:  dark ? '#a78bfa' : '#7c3aed',
      bg:     dark ? 'rgba(167,139,250,0.10)' : '#faf5ff',
      border: dark ? 'rgba(167,139,250,0.22)' : '#ddd6fe',
      text:   dark ? '#c4b5fd' : '#4c1d95',
    },
    teal: {
      color:  dark ? '#2dd4bf' : '#0d9488',
      bg:     dark ? 'rgba(45,212,191,0.10)'  : '#f0fdfa',
      border: dark ? 'rgba(45,212,191,0.22)'  : '#ccfbf1',
      text:   dark ? '#5eead4' : '#134e4a',
    },
  }
}
