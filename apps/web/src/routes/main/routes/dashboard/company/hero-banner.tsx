/** @format */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FC } from "react";
import { CompanyDashboardData } from "./use-fetch-dashboard-data";

type Props = Pick<CompanyDashboardData, "pendingTasks" | "recruitmentGoals">;

const HeroBanner: FC<Props> = ({ pendingTasks, recruitmentGoals }) => {
  return (
    <Card
      className="aspect-hero-banner w-full text-white p-4 max-h-48"
      style={{
        background:
          "linear-gradient(218.9deg, hsla(243, 50%, 53%, 0.85) 3.19%, hsla(240, 15%, 26%, 0.85) 84.45%, hsla(240, 16%, 24%, 0.85) 102.22%), url('/assets/images/dashboard/hero-section/footballers-rounded-and-kneeling.webp')",
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }}
    >
      <CardHeader className="pt-0 px-0">
        <CardTitle>
          <h1 className="capitalize text-xl">Hello Recruiter</h1>
        </CardTitle>

        <CardDescription>
          <p className="text-white font-medium">
            You have {pendingTasks} pending tasks
          </p>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-1 bg-white bg-opacity-30 p-2 rounded-lg">
        {/* this text depends on the userType */}
        <p>
          Recruitment Goals acheived
          <br />
          <strong className="text-xl">{`${recruitmentGoals.achieved}/${recruitmentGoals.total}`}</strong>
        </p>

        <Progress
          value={(recruitmentGoals.achieved / recruitmentGoals.total) * 100}
          className="bg-gray-50 [&>*]:!bg-lime-400"
        />
      </CardContent>
    </Card>
  );
};

export default HeroBanner;
