import { Paper, Group, Text, Box } from '@mantine/core';
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
        <ThemeToggle />
      </Group>
    </Paper>
  );
}

