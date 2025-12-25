import { ButtonProps, Button } from "@ui-kitten/components";

interface ButtonKitProps extends ButtonProps {
    label: string;
}

export const ButtonKit = ({ label, ...props }: ButtonKitProps) => {
    return (
        <Button {...props}>
            {label}
        </Button>
    )
}