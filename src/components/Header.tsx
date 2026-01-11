import { Paper, Group, Box, ActionIcon, Tooltip } from '@mantine/core';
import { IconBrandGithub } from '@tabler/icons-react';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  return (
    <Paper p="md" component="header" role="banner">
      <Group justify="space-between" align="center" h={36}>
        <Box
          px="sm"
          component="h1"
          style={{
            border: '1px solid var(--mantine-color-text)',
            boxShadow: 'var(--mantine-color-text) 5px 5px 0px 0px',
            backgroundColor: 'var(--mantine-color-body)',
            margin: 0,
            fontSize: 'var(--mantine-font-size-xl)',
            fontWeight: 700,
          }}
        >
          serialconsole.app
        </Box>
        <Group gap="xs">
          <Tooltip label="View on GitHub">
            <ActionIcon
              variant="outline"
              component="a"
              href="https://github.com/aruldd/serialconsole.app"
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
              aria-label="View on GitHub"
            >
              <IconBrandGithub size={18} />
            </ActionIcon>
          </Tooltip>
          <ThemeToggle />
        </Group>
      </Group>
    </Paper>
  );
}

