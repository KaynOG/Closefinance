import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            "group toast glass-strong !rounded-lg !border-border !bg-popover/80 !text-foreground !font-sans backdrop-blur-xl",
          title: "!font-semibold !text-foreground",
          description: "!text-muted-foreground !font-mono !text-[11px]",
          actionButton: "!rounded-md !bg-primary !text-primary-foreground",
          cancelButton: "!rounded-md !bg-muted !text-muted-foreground",
          closeButton: "!rounded-md !bg-popover !border-border !text-foreground",
          icon: "!text-primary",
          success: "!text-foreground",
          error: "!text-foreground",
          warning: "!text-foreground",
          info: "!text-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
