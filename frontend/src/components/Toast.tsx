type ToastType = "success" | "error" | "info";

type Props = {
  message: string;
  type?: ToastType;
  onClose: () => void;
};

export function Toast({ message, type = "info", onClose }: Props) {
  return (
    <div className={`toast toast-${type}`} onClick={onClose}>
      <span className="toast-cat">ᓚᘏᗢ</span>
      <span>{message}</span>
    </div>
  );
}