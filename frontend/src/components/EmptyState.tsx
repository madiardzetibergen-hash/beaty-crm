type Props = {
  title: string;
  text: string;
  actionText?: string;
  onAction?: () => void;
};

export function EmptyState({ title, text, actionText, onAction }: Props) {
  return (
    <div className="cute-empty-state">
      <div className="empty-cat">
        <span>ฅ</span>
        <b>ᓚᘏᗢ</b>
      </div>

      <h3>{title}</h3>
      <p>{text}</p>

      {actionText && onAction && (
        <button onClick={onAction}>{actionText}</button>
      )}
    </div>
  );
}