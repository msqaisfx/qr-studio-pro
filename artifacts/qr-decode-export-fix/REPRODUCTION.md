# Reproduction

- Payload: `https://msqaisfx.github.io/qr-studio-pro/`
- Logo: `C513347B-138A-4331-BD6A-D6724F959540.PNG`
- Logo SHA-256: `9879d5e3bd1b754f9658655eaac9cd34936870c7b488168d08d0f389dd3ea2fb`
- PNG: 512×512
- Quiet zone: 4 modules
- ECC: M and H
- Logo sizes: 20%, 25%, 30%, 35%
- Fusion styles: Seamless Fusion, Adaptive Badge, Minimal Cutout, Premium Brand

The complete 32-case result is in `matrix/decoder-matrix.json`.

Summary:

- ECC M: 20% decoded in all four styles with a design-risk warning. 25–35% failed both readers in all four styles.
- ECC H: 20% and 25% decoded in all four styles; 30% decoded with warnings; 35% decoded with warnings except Adaptive Badge, which failed both readers.
- No runtime exception occurred in the matrix.
