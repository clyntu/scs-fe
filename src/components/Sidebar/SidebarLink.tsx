import ListItemButton from "@mui/joy/ListItemButton";
import ListItemDecorator from "@mui/joy/ListItemDecorator";
import ListItemContent from "@mui/joy/ListItemContent";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarLinkProps {
  Icon: any;
  label: string;
  link: string;
  selected?: boolean;
}

const SidebarLink = ({
  Icon,
  label,
  link,
  selected,
}: SidebarLinkProps): JSX.Element => {
  const pathName = usePathname();

  return (
    <Link href={link}>
      <ListItemButton selected={pathName === link}>
        <ListItemDecorator>
          <Icon fontSize="small" />
        </ListItemDecorator>
        <ListItemContent>{label}</ListItemContent>
      </ListItemButton>
    </Link>
  );
};

export default SidebarLink;
