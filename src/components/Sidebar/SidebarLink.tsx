import ListItemButton from "@mui/joy/ListItemButton";
import ListItemDecorator from "@mui/joy/ListItemDecorator";
import ListItemContent from "@mui/joy/ListItemContent";
import Tooltip from "@mui/joy/Tooltip";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarLinkProps {
  Icon: any;
  label: string;
  link: string;
  collapsed: boolean;
}

const SidebarLink = ({
  Icon,
  label,
  link,
  collapsed,
}: SidebarLinkProps): JSX.Element => {
  const pathName = usePathname();
  const isCurrent = pathName === link;

  const content = (
    <Link
      href={link}
      className="sidebar-link"
      aria-current={isCurrent ? "page" : undefined}
    >
      <ListItemButton selected={isCurrent}>
        <ListItemDecorator>
          <Icon fontSize="small" />
        </ListItemDecorator>
        <ListItemContent className="sidebar-control-label">
          {label}
        </ListItemContent>
      </ListItemButton>
    </Link>
  );

  return collapsed ? (
    <Tooltip title={label} placement="right">
      {content}
    </Tooltip>
  ) : (
    content
  );
};

export default SidebarLink;
