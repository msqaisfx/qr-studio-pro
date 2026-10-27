import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/app/App'
import { AppProviders } from '../src/app/AppProviders'

const append = vi.fn()
const download = vi.fn().mockResolvedValue(undefined)

vi.mock('qr-code-styling', () => ({
  default: class MockQRCodeStyling {
    _qr = { getModuleCount: () => 29 }
    append = append
    download = download
    update = vi.fn()
  },
}))

function renderApp() {
  return render(<AppProviders><App /></AppProviders>)
}

describe('QR Studio Pro', () => {
  beforeEach(() => {
    append.mockClear()
    download.mockClear()
  })

  it('shows a clear empty state and disables download', () => {
    renderApp()
    expect(screen.getByText('ابدأ بكتابة محتوى')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'فتح استوديو التصدير' }).find((button) => button.classList.contains('download-button'))).toBeDisabled()
  })

  it('updates the QR preview when content is entered', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.type(screen.getByRole('textbox', { name: 'رابط الموقع' }), 'https://example.com')
    expect(append).toHaveBeenCalled()
    expect(screen.getAllByRole('button', { name: 'فتح استوديو التصدير' }).find((button) => button.classList.contains('download-button'))).toBeEnabled()
  })

  it('switches language, direction, and persists the choice', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: 'التبديل إلى الإنجليزية' }))
    expect(screen.getByText('Design your code. Keep your privacy.')).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('lang', 'en')
    expect(document.documentElement).toHaveAttribute('dir', 'ltr')
    expect(localStorage.getItem('qr-studio-pro:language')).toBe('en')
  })

  it('switches theme immediately and persists it', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: 'الوضع الفاتح' }))
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    expect(localStorage.getItem('qr-studio-pro:theme')).toBe('light')
  })

  it('keeps future studio tools explicitly unavailable', () => {
    renderApp()
    expect(screen.getByRole('button', { name: 'الإطارات' })).toBeDisabled()
    expect(screen.getAllByText('قريبًا').length).toBeGreaterThan(0)
  })

  it('opens the accessible local logo uploader', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: 'فتح تخصيص الشعار' }))
    expect(await screen.findByRole('heading', { name: 'محرك دمج الشعار الذكي 3.0' })).toBeInTheDocument()
    expect(screen.getByText(/PNG أو JPEG أو WebP/)).toBeInTheDocument()
  })

  it('opens Colors and applies a real preset', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: 'فتح تخصيص الألوان' }))
    expect(await screen.findByRole('heading', { name: 'الألوان والتدرجات', level: 1 })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'أزرق منتصف الليل' }))
    expect(screen.getByRole('textbox', { name: 'قيمة HEX' })).toHaveValue('#0b1f3a')
    await user.click(screen.getByRole('button', { name: 'استعادة الألوان' }))
    expect(screen.getByRole('textbox', { name: 'قيمة HEX' })).toHaveValue('#07110f')
  })

  it('edits a multi-stop gradient with an accessible rotation control', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: 'فتح تخصيص الألوان' }))
    await user.click(await screen.findByRole('button', { name: 'تدرج خطي' }))
    await user.click(screen.getByRole('button', { name: /إضافة نقطة/ }))
    expect(screen.getAllByRole('textbox')).toHaveLength(4)
    expect(screen.getByRole('slider', { name: /زاوية التدرج/ })).toBeInTheDocument()
  })

  it('opens Shapes and applies a live body pattern selection', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: 'فتح تخصيص الأشكال' }))
    const dots = await screen.findByRole('button', { name: 'نقاط' })
    await user.click(dots)
    expect(dots).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('heading', { name: 'تخصيص الأشكال' })).toBeInTheDocument()
  })

  it('opens the unified export studio from the preview', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.type(screen.getByRole('textbox', { name: 'رابط الموقع' }), 'https://example.com')
    const previewExport = screen.getAllByRole('button', { name: 'فتح استوديو التصدير' }).find((button) => button.classList.contains('download-button'))
    expect(previewExport).toBeDefined()
    await user.click(previewExport!)
    expect(await screen.findByRole('heading', { name: 'التصدير الاحترافي' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'PNG' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('opens the accessible Scan Guard report without applying fixes', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: 'فتح تقرير جودة QR' }))
    expect(await screen.findByRole('heading', { name: 'حارس قراءة QR' })).toBeInTheDocument()
    expect(screen.getByText('لا تُطبق الاقتراحات تلقائيًا مطلقًا.')).toBeInTheDocument()
    expect(screen.getAllByText('غير معروف').length).toBeGreaterThan(0)
  })
})
