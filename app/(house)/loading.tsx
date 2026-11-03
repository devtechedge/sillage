export default function Loading() {
  return (
    <div className="loading" role="status" aria-live="polite">
      <span className="loading__bar" />
      <p>Opening the cabinet.</p>
    </div>
  );
}
