import axios from 'axios';

axios.defaults.withCredentials = true;

export const getRides = async () => {
    try {
        const response = await axios.get('http://localhost:8000/rides/user');
        return response.data;
    } catch (error) {
        throw error;
    }
};

