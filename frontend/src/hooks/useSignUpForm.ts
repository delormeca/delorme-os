import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { formSchemas } from './forms/useStandardForm';

export const useSignUpForm = () => {
  return useForm({
    resolver: yupResolver(formSchemas.signup),
    mode: "onChange",
  });
};
