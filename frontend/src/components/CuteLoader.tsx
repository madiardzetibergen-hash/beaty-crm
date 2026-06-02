import { useLottie } from "lottie-react";
import catLoader from "../assets/cat-loader.json";

type Props = {
  text?: string;
};

export function CuteLoader({ text = "Котик загружает данные..." }: Props) {
  const options = {
    animationData: catLoader,
    loop: true,
    autoplay: true,
  };

  const { View } = useLottie(options);

  return (
    <div className="cute-loader">
      <div className="cute-loader-animation">
        {View}
      </div>

      <p>{text}</p>
    </div>
  );
}