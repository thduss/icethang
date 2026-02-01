import api from '../api/api'; 

export const getMyCharacters = (studentId: number) => {
  return api.get(`/themes/characters/my`, {
    params: { studentId },
  });
};