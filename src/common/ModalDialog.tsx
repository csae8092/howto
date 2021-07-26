import { useDialog } from '@react-aria/dialog'
import { FocusScope } from '@react-aria/focus'
import type { OverlayProps as AriaOverlayProps } from '@react-aria/overlays'
import {
  useModal,
  useOverlay,
  usePreventScroll,
  OverlayContainer,
} from '@react-aria/overlays'
import type { ReactNode } from 'react'
import { useRef } from 'react'

export interface ModalDialogProps extends AriaOverlayProps {
  title: string
  children: ReactNode
}

/**
 * Modal dialog.
 */
export function ModalDialog(props: ModalDialogProps): JSX.Element {
  const { title, children } = props

  const overlayRef = useRef<HTMLDivElement>(null)
  const { overlayProps, underlayProps } = useOverlay(props, overlayRef)

  usePreventScroll()
  const { modalProps } = useModal()

  const { dialogProps, titleProps } = useDialog({}, overlayRef)

  return (
    <OverlayContainer>
      <div
        {...underlayProps}
        className="fixed inset-0 z-10 flex flex-col items-center justify-start p-4 bg-black bg-opacity-50 md:p-10vmin"
      >
        <FocusScope contain restoreFocus autoFocus>
          <div
            className="flex flex-col w-full p-8 overflow-hidden bg-white rounded shadow-md"
            {...overlayProps}
            {...dialogProps}
            {...modalProps}
            ref={overlayRef}
          >
            <h2 {...titleProps} className="sr-only">
              {title}
            </h2>
            {children}
          </div>
        </FocusScope>
      </div>
    </OverlayContainer>
  )
}
