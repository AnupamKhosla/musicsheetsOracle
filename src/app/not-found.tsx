export default function NotFound() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}
    >
      <div
        style={{
          maxWidth: 600,
          width: '100%',
          padding: '3rem 2rem',
          textAlign: 'center',
          background: '#fff',
          border: '1px solid #fecdd3',
          borderRadius: 12,
          boxShadow: '0 2px 16px rgba(225, 29, 72, 0.06)',
        }}
      >
        <h1
          style={{
            fontSize: '4rem',
            fontWeight: 700,
            color: '#E11D48',
            margin: 0,
            fontFamily: '"EB Garamond", Georgia, serif',
            lineHeight: 1.1,
          }}
        >
          404
        </h1>
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: '#1C1917',
            marginTop: '1rem',
            marginBottom: '0.5rem',
          }}
        >
          Page not found
        </h2>
        <p
          style={{
            color: '#444',
            fontSize: '1rem',
            lineHeight: 1.6,
            marginBottom: '2rem',
          }}
        >
          We couldn’t find the page you were looking for. It may have been moved
          or the link is no longer valid.
        </p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            padding: '0.6rem 1.4rem',
            background: '#E11D48',
            color: 'white',
            textDecoration: 'none',
            borderRadius: 6,
            fontWeight: 500,
          }}
        >
          Go home
        </a>
      </div>
    </div>
  );
}
