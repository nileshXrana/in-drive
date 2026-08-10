"use client";

import * as React from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { useDispatch, useSelector } from 'react-redux';
import { getUserThunk } from '@/features/users/user.action';
import { AppDispatch } from '@/store';
import { saveUserRole } from '@/services/user.service';
import { useRouter } from 'next/navigation'

export default function BasicSelect() {
    const router = useRouter();
    const [role, setRole] = React.useState('');
    const [user, setUser] = React.useState<any>(null);
    const dispatch = useDispatch<AppDispatch>();

    const handleChange = async (event: SelectChangeEvent) => {
        // save in db
        const res = await saveUserRole(event.target.value as string);
        setRole(event.target.value as string);
    };

    React.useEffect(() => {
        async function fetchUser() {
            const res = await dispatch(getUserThunk());
            setUser(res.payload);
            setRole(res.payload?.role || '');

            if (res.payload?.role === 'passenger') {
                router.push('/dashboard');
            } else if (res.payload?.role === 'driver') {
                router.push('/rider-dashboard');
            }
        }
        fetchUser();
    }, [dispatch, role]);

    return (
        <Box sx={{ minWidth: 120 }}>
            <FormControl variant='standard' fullWidth>
                <InputLabel id="demo-simple-select-label">Role</InputLabel>
                <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={role}
                    label="Role"
                    onChange={handleChange}
                >
                    <MenuItem value={'passenger'}>Passenger</MenuItem>
                    <MenuItem value={'driver'}>Driver</MenuItem>
                </Select>
            </FormControl>
        </Box>
    );
}
