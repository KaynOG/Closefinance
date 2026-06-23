import logoAsset from "@/assets/logo-closefinance-v2.png.asset.json";

export function Logo({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt="CloseFinance"
      width={size}
      height={size}
      className={`object-contain shrink-0 ${className}`}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}
