import { Paper, Group, Text, Box, ActionIcon, Tooltip } from '@mantine/core';
import { IconBrandGithub } from '@tabler/icons-react';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  return (
    <Paper p="md">
      <Group justify="space-between" align="center" h={36}>
        <Box px="sm" style={{
          border: '1px solid var(--mantine-color-text)',
          boxShadow: 'var(--mantine-color-text) 5px 5px 0px 0px',
          backgroundColor: 'var(--mantine-color-body)',
        }}>
          <Text fw={700} size="xl" >
            serialconsole.app
          </Text>
        </Box>
        <Group gap="xs">
          <Tooltip label="View on GitHub">
            <ActionIcon
              variant="outline"
              component="a"
              href="https://github.com/aruldd/serial-monitor"
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

