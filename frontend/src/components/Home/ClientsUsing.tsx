import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import { Stack } from "@mui/material";
import Photo1 from "@/assets/photo-1.jpg";
import Photo2 from "@/assets/photo-2.jpg";
import Photo3 from "@/assets/photo-3.jpg";

const ClientsUsingPanel = () => {
  return (
    <Stack direction="row" justifyContent="start" alignItems="center">
      <AvatarGroup
        renderSurplus={(surplus) => (
          <span style={{ color: "#f2f2f2" }}>+{surplus.toString()[0]}k</span>
        )}
        total={4251}
      >
        <Avatar alt="Remy Sharp" src={Photo1} />
        <Avatar alt="Travis Howard" src={Photo2} />
        <Avatar alt="Agnes Walker" src={Photo3} />
      </AvatarGroup>
    </Stack>
  );
};

export default ClientsUsingPanel;
