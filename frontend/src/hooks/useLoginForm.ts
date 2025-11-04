import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { formSchemas } from './forms/useStandardForm';

export const useLoginForm = () => {
  return useForm({
    resolver: yupResolver(formSchemas.login),
    mode: "onChange",
  });
};
