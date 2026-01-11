import { Paper, Stack, Text, Title, List, ThemeIcon, Anchor } from '@mantine/core';
import { IconBrowser, IconCheck, IconX, IconExternalLink } from '@tabler/icons-react';
import { useIntl } from 'react-intl';

interface BrowserNotSupportedModalProps {
    opened: boolean;
}

export function BrowserNotSupportedModal({ opened }: BrowserNotSupportedModalProps) {
    const intl = useIntl();
    const t = (key: string) => intl.formatMessage({ id: key });

    if (!opened) {
        return null;
    }

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 10000,
                backgroundColor: 'var(--mantine-color-body)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
            }}
        >
            <Paper
                shadow="xl"
                p="xl"
                radius="md"
                style={{
                    maxWidth: '600px',
                    width: '100%',
                }}
            >
                <Stack gap="lg">
                    <div style={{ textAlign: 'center' }}>
                        <ThemeIcon size={64} radius="xl" color="red" variant="light" style={{ margin: '0 auto' }}>
                            <IconBrowser size={32} />
                        </ThemeIcon>
                    </div>

                    <Title order={2} ta="center">
                        {t('browserSupport.title')}
                    </Title>

                    <Text size="md" c="dimmed" ta="center">
                        {t('browserSupport.message')}
                    </Text>

                    <div>
                        <Text fw={500} size="sm" mb="xs">
                            {t('browserSupport.supportedBrowsers')}
                        </Text>
                        <List
                            spacing="xs"
                            size="sm"
                            icon={
                                <ThemeIcon color="green" size={20} radius="xl">
                                    <IconCheck size={12} />
                                </ThemeIcon>
                            }
                        >
                            <List.Item>{t('browserSupport.chrome')}</List.Item>
                            <List.Item>{t('browserSupport.edge')}</List.Item>
                            <List.Item>{t('browserSupport.opera')}</List.Item>
                        </List>
                    </div>

                    <div>
                        <Text fw={500} size="sm" mb="xs">
                            {t('browserSupport.notSupportedBrowsers')}
                        </Text>
                        <List
                            spacing="xs"
                            size="sm"
                            icon={
                                <ThemeIcon color="red" size={20} radius="xl">
                                    <IconX size={12} />
                                </ThemeIcon>
                            }
                        >
                            <List.Item>{t('browserSupport.firefox')}</List.Item>
                            <List.Item>{t('browserSupport.safari')}</List.Item>
                            <List.Item>{t('browserSupport.other')}</List.Item>
                        </List>
                    </div>

                    <Text size="sm" c="dimmed" ta="center" mt="md">
                        {t('browserSupport.note')}
                    </Text>

                    <Anchor
                        href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility"
                        target="_blank"
                        rel="noopener noreferrer"
                        size="sm"
                        ta="center"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                        {t('browserSupport.learnMore')}
                        <IconExternalLink size={14} />
                    </Anchor>
                </Stack>
            </Paper>
        </div>
    );
}

