"use client";

import { useEffect, useState } from 'react';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

type SuggestionOption = {
    id: string;
    label: string;
    placeName: string;
    coordinates?: [number, number];
};

export default function FreeSolo() {
    const [inputValue, setInputValue] = useState('');
    const [value, setValue] = useState<SuggestionOption | null>(null);
    const [options, setOptions] = useState<SuggestionOption[]>([]);
    const [loading, setLoading] = useState(false);
    const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;

    useEffect(() => {
        if (!inputValue.trim() || inputValue.trim().length < 2) {
            setOptions([]);
            return;
        }

        const controller = new AbortController();

        const timer = window.setTimeout(async () => {
            if (!apiKey) {
                setOptions([]);
                setLoading(false);
                return;
            }

            setLoading(true);

            try {
                const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(inputValue.trim())}.json?key=${apiKey}&limit=5&language=en`;
                const res = await fetch(url, { signal: controller.signal });

                if (!res.ok) {
                    throw new Error('Failed to fetch suggestions');
                }

                const data = await res.json();
                const features = Array.isArray(data?.features) ? data.features : [];

                const nextOptions = features.map((feature: any, index: number) => ({
                    id: feature.id ?? `${inputValue.trim()}-${index}`,
                    label: feature.place_name ?? feature.text ?? 'Unknown place',
                    placeName: feature.place_name ?? feature.text ?? 'Unknown place',
                    coordinates: feature.geometry?.coordinates
                        ? [feature.geometry.coordinates[1], feature.geometry.coordinates[0]]
                        : undefined,
                }));

                setOptions(nextOptions);
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    console.error('MapTiler geocoding failed:', error);
                    setOptions([]);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }, 300);

        return () => {
            controller.abort();
            window.clearTimeout(timer);
        };
    }, [inputValue, apiKey]);

    return (
        <Stack spacing={2} sx={{ width: '100%' }}>
            <Autocomplete
                freeSolo
                disableClearable
                loading={loading}
                options={options}
                getOptionLabel={(option) => {
                    if (typeof option === 'string') {
                        return option;
                    }

                    return option?.label ?? '';
                }}
                inputValue={inputValue}
                value={value ?? undefined}
                onInputChange={(_, newValue) => setInputValue(newValue)}
                onChange={(_, newValue) => {
                    if (typeof newValue === 'string') {
                        setValue(null);
                        setInputValue(newValue);
                        return;
                    }

                    setValue(newValue);
                    setInputValue(newValue?.label ?? '');
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Pickup location"
                        placeholder="Search a place"
                        slotProps={{
                            ...params.slotProps,
                            input: {
                                ...params.slotProps?.input,
                                endAdornment: (
                                    <>
                                        {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.slotProps?.input?.endAdornment}
                                    </>
                                ),
                            },
                        }}
                    />
                )}
            />
        </Stack>
    );
}
