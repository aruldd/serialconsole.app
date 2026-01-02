import { ActionIcon, Tooltip } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { useMantineColorScheme } from '@mantine/core';
import { useIntl } from 'react-intl';

export function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const intl = useIntl();
  const t = (key: string) => intl.formatMessage({ id: key });
  const isDark = colorScheme === 'dark';

  return (
    <Tooltip label={isDark ? t('common.lightMode') : t('common.darkMode')}>
      <ActionIcon
        variant="filled"
        color={isDark ? 'yellow' : 'black'}
        onClick={() => toggleColorScheme()}
        size="lg"
        aria-label={isDark ? t('common.lightMode') : t('common.darkMode')}
      >
        {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
      </ActionIcon>
    </Tooltip>
  );
}

