'use client'
import { Modal, Stack, Text, Group, Button } from '@mantine/core'

interface Props {
  opened: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  confirmColor?: string
}

export function ConfirmModal({
  opened, onClose, onConfirm, title, message,
  confirmLabel = 'Confirmar', confirmColor = 'blue',
}: Props) {
  return (
    <Modal opened={opened} onClose={onClose} title={title} centered size="sm">
      <Stack>
        <Text size="sm">{message}</Text>
        <Group justify="flex-end">
          <Button variant="light" onClick={onClose}>Cancelar</Button>
          <Button color={confirmColor} onClick={() => { onConfirm(); onClose() }}>
            {confirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
