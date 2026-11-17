// A small SMTP client for one plain-text email over implicit TLS (port 465).
// Supabase Edge Functions can't open ports 25 or 587, so Brevo's SSL port is
// used whatever BREVO_SMTP_PORT says unless it's another allowed port with
// implicit TLS. AUTH LOGIN, UTF-8 subject and base64 body (no dot-stuffing or
// long-line worries).

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

export interface Mail {
  from: string;
  fromName?: string;
  to: string[];
  subject: string;
  text: string;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64(s: string): string {
  const bytes = enc.encode(s);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function wrap76(s: string): string {
  return s.replace(/.{1,76}/g, (m) => `${m}\r\n`);
}

/** The port to use: 465 unless the configured one is a TLS port other than the blocked 25/587. */
export function tlsPort(configured: string | undefined): number {
  const n = Number(configured);
  return Number.isInteger(n) && n > 0 && n !== 25 && n !== 587 && n !== 2525 ? n : 465;
}

export function buildMessage(mail: Mail, now = new Date()): string {
  const id = `${crypto.randomUUID()}@nightshift.app`;
  const from = mail.fromName ? `=?UTF-8?B?${b64(mail.fromName)}?= <${mail.from}>` : mail.from;
  const headers = [
    `From: ${from}`,
    `To: ${mail.to.join(', ')}`,
    `Subject: =?UTF-8?B?${b64(mail.subject)}?=`,
    `Date: ${now.toUTCString().replace('GMT', '+0000')}`,
    `Message-ID: <${id}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: base64',
  ];
  return `${headers.join('\r\n')}\r\n\r\n${wrap76(b64(mail.text))}`;
}

export async function sendMail(cfg: SmtpConfig, mail: Mail): Promise<void> {
  const conn = await Deno.connectTls({ hostname: cfg.host, port: cfg.port });
  const buf = new Uint8Array(4096);
  let pending = '';

  async function reply(): Promise<{ code: number; text: string }> {
    // Read until a line "NNN text" (not "NNN-text") ends the reply.
    for (;;) {
      const lines = pending.split('\r\n');
      for (let i = 0; i < lines.length - 1; i++) {
        if (/^\d{3} /.test(lines[i])) {
          const text = lines.slice(0, i + 1).join('\n');
          pending = lines.slice(i + 1).join('\r\n');
          return { code: Number(lines[i].slice(0, 3)), text };
        }
      }
      const n = await conn.read(buf);
      if (n === null) throw new Error('SMTP connection closed');
      pending += dec.decode(buf.subarray(0, n));
    }
  }
  async function cmd(line: string, ok: number[], label = line.split(' ')[0]): Promise<void> {
    await conn.write(enc.encode(`${line}\r\n`));
    const r = await reply();
    // Never echo the command (it can hold the login); the server's code and first words only.
    if (!ok.includes(r.code)) throw new Error(`SMTP ${label} refused: ${r.code} ${r.text.slice(4, 80)}`);
  }

  try {
    const hello = await reply();
    if (hello.code !== 220) throw new Error(`SMTP greeting: ${hello.code}`);
    await cmd('EHLO nightshift.app', [250]);
    await cmd('AUTH LOGIN', [334]);
    await cmd(b64(cfg.user), [334], 'AUTH user');
    await cmd(b64(cfg.pass), [235], 'AUTH password');
    await cmd(`MAIL FROM:<${mail.from}>`, [250]);
    for (const to of mail.to) await cmd(`RCPT TO:<${to}>`, [250, 251]);
    await cmd('DATA', [354]);
    await cmd(`${buildMessage(mail)}\r\n.`, [250], 'message');
    await cmd('QUIT', [221]).catch(() => {});
  } finally {
    try {
      conn.close();
    } catch {
      // already closed
    }
  }
}
