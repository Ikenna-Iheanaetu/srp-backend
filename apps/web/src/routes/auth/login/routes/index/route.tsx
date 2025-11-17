/** @format */

import { FC } from "react";
import { LoginDisplayLayout } from "../../login-display-layout";
import { LoginFormMapper } from "./form-mapper";

const AuthLoginFormRoute: FC = () => {
  return (
    <LoginDisplayLayout>
      <LoginFormMapper />
    </LoginDisplayLayout>
  );
};

export default AuthLoginFormRoute;
