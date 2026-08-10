
'use client';

import { Box, Button, ListItemIcon, Typography } from "@mui/material";
import styles from "./dashboard.module.css";
import AccountMenu from "@/components/profile-menu";
import Logout from "@mui/icons-material/Logout";
import BasicSelect from "@/components/role-select";
import { logoutThunk } from "@/features/users/user.action";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { useRouter } from "next/navigation";
import { TextField } from '@mui/material';
import FreeSolo from "@/components/auto-search";

export default function DashboardPage() {

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    router.push("/login");
  };


  return (
    <Box className={styles.dashboard}>
      <Box className={styles.header}>
        <Typography variant="h6" >
          InDrive
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <BasicSelect />
          <Button variant="outlined" onClick={handleLogout}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            Logout

          </Button>

        </Box>

      </Box>

      <Box className={styles.content}>
        
        <form action="">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
            <FreeSolo />
            <FreeSolo />
            <TextField label="Price" variant="outlined" type="number" />
            <TextField label="Note" variant="outlined" multiline rows={4} />
            <Button variant="contained" color="primary">
              Book Ride
            </Button>
          </Box>
        </form>
      </Box>




    </Box>
  );
}