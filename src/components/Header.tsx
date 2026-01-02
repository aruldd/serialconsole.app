import { Paper, Group, Text } from '@mantine/core';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  return (
    <Paper p="md">
      <Group justify="space-between" align="center">
        <Text fw={700} size="xl" >
          serialconsole.app
        </Text>
        <ThemeToggle />
      </Group>
    </Paper>
  );
}

