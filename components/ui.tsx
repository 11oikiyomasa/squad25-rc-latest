import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md';

type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children' | 'href'>;

const buttonBase = 'ui-button';

export function Button({ children, variant = 'primary', size = 'md', href, className = '', ...props }: ButtonProps) {
  const classes = `${buttonBase} ui-button-${variant} ui-button-${size} ${className}`.trim();
  if (href) {
    return <Link href={href} className={classes} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>{children}</Link>;
  }
  return <button type="button" className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>;
}

export function Card({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`ui-card ${className}`.trim()} {...props}>{children}</div>;
}

export function Section({ children, className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={`ui-section ${className}`.trim()} {...props}>{children}</section>;
}

export function PageHeader({ eyebrow, title, accent, description, aside, className = '' }: {
  eyebrow?: string;
  title: string;
  accent?: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`ui-page-header ${className}`.trim()}>
      <div className="ui-container ui-page-header-inner">
        <div className="ui-page-header-copy">
          {eyebrow && <div className="ui-eyebrow">{eyebrow}</div>}
          <h1 className="ui-page-title">{title}{accent && <span className="ui-page-title-accent">{accent}</span>}</h1>
          {description && <p className="ui-page-description">{description}</p>}
        </div>
        {aside && <div className="ui-page-header-aside">{aside}</div>}
      </div>
    </header>
  );
}

export function EmptyState({ title, description, action, className = '' }: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`ui-empty ${className}`.trim()}>
      <div className="ui-empty-mark" aria-hidden="true" />
      <div className="ui-eyebrow">No public data</div>
      <h2 className="ui-empty-title">{title}</h2>
      {description && <p className="ui-empty-description">{description}</p>}
      {action && <div className="ui-empty-action">{action}</div>}
    </div>
  );
}

export function AppShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <main className={`ui-shell ${className}`.trim()}>{children}</main>;
}
