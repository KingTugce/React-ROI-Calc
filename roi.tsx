import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Button,
  Table,
  Input,
  InputNumber,
  Modal,
  Spin,
  Slider,
  Select,
  Checkbox,
  message,
  Radio,
  Form,
  Collapse,
} from "antd";
import { VideoCameraOutlined } from "@ant-design/icons";
import CountUp from "react-countup";
import { useForm, Controller } from "react-hook-form";
import { VictoryBar, VictoryChart, VictoryTheme, VictoryAxis } from "victory";
import "../../index.css";
import { InputNumberProps } from "antd/lib/input-number";
import api from "../../lib/api";

const { Panel } = Collapse;

const configuration = [
  "TV Truck & Lead Operator",

  "Assistant TV Laborer",

  "Cleaning Truck: Combo Vac & Operator",

  "Cleaning Trailer: Jetter only & Operator",

  "Additional Cleaning Laborer",

  "Traffic Control Flagger",

  "Traffic Control Support Truck/Signal Board",

  "Misc. Assistant Laborer",
];

const Card = ({
  className,
  children,
  style,
  white,
}: {
  white?: boolean;
  className: string;
  children: any;
  style?: any;
}) => {
  return (
    <article
      style={Object.assign(
        {},
        { backgroundColor: white ? "white" : "#f7fafccc" },
        style
      )}
      className={`${className} shadow-sm border-2 border-gray-300 rounded-md my-6`}
    >
      {children}
    </article>
  );
};

const InputCard = ({
  isMoney,
  unit,
  description,
  label,
  control,
  name,
  ...props
}: {
  control: any;
  unit: string;
  isMoney?: boolean;
  description: string;
  label: string;
} & InputNumberProps) => {
  return (
    <Card
      style={{ backgroundColor: "white" }}
      className="text-center p-4 text-lg"
    >
      <p className="font-bold text-lg">{label}</p>
      <p className="text-gray-700">{description}</p>
      {isMoney && (
        <>
          <span className="text-3xl mr-2">$</span>
          {/* @ts-ignore */}
          <Controller
            type="number"
            name={name}
            step=".01"
            as={InputNumber}
            control={control}
            {...props}
            className="mt-3 mb-1 text-center text-2xl w-48"
          />
        </>
      )}
      {!isMoney && (
        //@ts-ignore
        <Controller
          name={name}
          as={InputNumber}
          control={control}
          {...props}
          className="mt-3 mb-1 text-center text-2xl w-48"
          formatter={(value) =>
            `${isMoney ? "$" : ""}${value}`.replace(
              /\B(?=(\d{3})+(?!\d))/g,
              ","
            )
          }
          parser={(value) =>
            value.replace(/\$\s?|(,*)/g, "").replace(/\D/g, "")
          }
        />
      )}

      <p className="text-gray-700 text-base">{unit}</p>
    </Card>
  );
};

const RFCheckboxGroup = ({
  ...props
}: {
  control: any;
  name: string;
  label: string;
  defaultValue: string[];
  options: string[];
}) => (
  <Controller
    render={({ onChange, onBlur, value, name }) => (
      <Checkbox.Group
        style={{ maxWidth: "300px" }}
        options={props.options}
        defaultValue={props.defaultValue}
        onChange={(e) => onChange(e)}
      />
    )}
    defaultValue={props.defaultValue}
    {...props}
  />
);

const formatMoney = (value) =>
  `$${value || ""}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const COST_PER_SHIFT = 2232.81;
const MAX_DP = 3501;

const RoiCalc = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    document.getElementsByTagName("body")[0].style.overflow = "hidden";
  }, []);
  const { control, watch, errors, handleSubmit } = useForm({
    // eslint-disable-next-line prettier/prettier
    defaultValues: { dp: 1500, bp: 2.00, scope: 50000, email: "" },
    mode: "all",
  });
  const { dp: rawDp, bp, scope } = watch();

  const dp = rawDp && rawDp < MAX_DP ? rawDp : 1500;
  const saiDP =
    dp <= 1500 ? dp * 2 : dp * (1 + Math.pow(0.98, (dp - 1500) / 50));
  // Shifts
  const saiShifts = scope / saiDP;
  const normalShifts = scope / dp;
  // Current cost per shift
  const shiftRevenue = dp * bp;
  const saiRevenue = saiDP * bp;
  const currentCostPerShift =
    (995 +
      8 * 45.7 +
      8 * 47 +
      8 * 65.2 +
      2 * 55 +
      ((dp * 0.1) / (2000 / 8)) * 33.85) *
    1.21;
  const saiCostPerShift = currentCostPerShift + 0.25 * saiDP;
  //Additional profit
  const additionalProfit = (normalShifts - saiShifts) * saiRevenue;
  // Cost per foot
  const costPerFootSai = saiCostPerShift / saiDP;
  const costPerFootOld = currentCostPerShift / dp;

  const profit = (costPerFootOld - costPerFootSai) * scope;

  const submitLogic = async (val) => {
    try {
      setIsSubmitting(true);
      await api.postROIEmail({
        body: {
          projectScope: scope,
          footPerShift: val.dp,
          bidPrice: val.bp.toFixed(2),
          theirCostPerFoot: costPerFootOld.toFixed(2),
          saiCostPerFoot: costPerFootSai.toFixed(2),
          shiftsSAI: saiShifts.toFixed(2),
          theirShifts: normalShifts.toFixed(2),
          email: val.email,
          savings: profit.toFixed(2),
          additionalProfit: additionalProfit.toFixed(2),
        },
      });
      setIsSubmitting(false);
      setSubmitted(true);
    } catch (error) {
      setIsSubmitting(false);
    }
  };

  const hideCalc = rawDp < MAX_DP;

  return (
    <div
      style={{ fontFamily: "cabin" }}
      className="max-w-4xl flex-col items-center mx-0 mt-4 md:mx-auto"
    >
      {/* <Card className="py-4 text-center text-2xl font-bold text-black">
        <h1 style={{ color: "#22a1d8" }}>
          Calculate Your Profit with SewerAI!
        </h1>
      </Card> */}
      <Card className="py-6 px-3">
        <h2 className="text-center text-xl">
          This calculator is intended to enable you to more accurately determine
          how SewerAI's AutoCode<sup>TM</sup> condition assesment solutions will
          help you make more money. Just provide a few simple inputs, and we'll
          show you the benefits.
        </h2>
        <Collapse ghost>
          <Panel
            header="DISCLAIMER: the calculator makes assumptions. Click here to see more. "
            key="1"
          >
            <ul className="flex flex-col sm:flex-row list-disc ml-10 space-x-0 sm:space-x-10">
              <li>
                "Current Workflow" refers to condition assessment tasks being
                manually conducted in the field, in real-time, by the CCTV
                operator ("Capture & Assess")
              </li>
              <li>
                The CCTV Crew consists of: CCTV Operator & Truck; Assistant
                Laborer; Vac Truck Operator and Jet-Vac (Combo) Truck
              </li>
              <li>
                Inspection of 6"-12" VCP/CON sanitary sewers with access points
                in residential (low-traffic) neighborhoods, with no additional
                flagging or traffic control support vehicles/arrow boards
              </li>
              <li>
                All figures used for crew wages are based on Davis-Bacon Act
                averages across the US
              </li>
            </ul>
          </Panel>
        </Collapse>
      </Card>
      <Card className="text-center py-4">
        <h1 className="text-2xl font-bold">Inputs</h1>
        <h2 className="text-gray-700 my-3">
          Consider a typical project in your operation
        </h2>
        <div className="flex justify-center space-x-0 flex-col md:flex-row md:space-x-10">
          <InputCard
            name="scope"
            control={control}
            description="(fill this in)"
            label="Hypothetical Project Scope"
            unit="linear feet"
          />
          <InputCard
            name="dp"
            control={control}
            description="(by one crew)"
            label="Feet Inspected Per Shift"
            unit="linear feet"
          />
          <InputCard
            isMoney
            name="bp"
            control={control}
            description="(per LF)"
            label="Bid Price"
            unit="dollars"
          />
        </div>
        {!hideCalc && (
          <p className="text-xl font-bold text-green-600">
            Wow. You have unusually high productivity! Shoot us an email so we
            can talk further.
          </p>
        )}
      </Card>

      {hideCalc && (
        <Card
          style={{ borderColor: "#1f93c1" }}
          className="pl-0 sm:px-12 text-center sm:text-left"
        >
          <h1 className="text-2xl text-center font-bold mt-4">Results</h1>
          <div>
            <div className="flex justify-between items-center text-xl flex-col sm:flex-row">
              <div className="w-1/2">Shifts to Complete Project</div>
              <div className="flex items-center space-x-5 w-1/2 justify-center sm:justify-start">
                <Card
                  white
                  className="text-center p-3 border-gray-600 text-gray-600"
                >
                  <p className="text-sm">Current Workflow</p>
                  <p className="font-bold">
                    <CountUp
                      className="text-gray-600 text-2xl"
                      end={parseFloat(normalShifts.toFixed(0))}
                    />
                  </p>
                </Card>
                <div>vs.</div>
                <Card
                  white
                  style={{
                    color: "#1f93c1",
                    borderColor: "#1f93c1",
                  }}
                  className="text-center p-3"
                >
                  <p className="text-sm">SewerAI Workflow</p>
                  <p
                    style={{ color: "#1f93c1" }}
                    className="font-bold text-2xl"
                  >
                    <CountUp end={parseFloat(saiShifts.toFixed(0))} />
                  </p>
                </Card>
              </div>
            </div>
            <div className="flex justify-between items-center text-xl flex-col sm:flex-row">
              <div className="">Cost Per Foot (Clean & TV)</div>
              <div className="flex items-center space-x-5">
                <VictoryChart
                  padding={70}
                  domainPadding={{ x: 60 }}
                  animate={{ duration: 2000 }}
                >
                  <VictoryAxis
                    style={{ axisLabel: { fontSize: "5px" } }}
                    dependentAxis
                    tickFormat={(x) => `$${x.toFixed(2)}`}
                  />
                  <VictoryAxis
                    tickValues={["Current Workflow", "SewerAI Workflow*"]}
                  />
                  <VictoryBar
                    style={{
                      data: {
                        fill: ({ datum }) =>
                          datum.method === "Current Workflow"
                            ? "#80808078"
                            : "#1f93c1",
                      },
                      labels: {
                        fontSize: 30,
                        fontStyle: "bold",
                      },
                    }}
                    labels={({ datum }) =>
                      `$${datum.cost && datum.cost.toFixed(2)}`
                    }
                    alignment="middle"
                    barRatio={0.9}
                    x="method"
                    y="cost"
                    data={[
                      { method: "SewerAI Workflow*", cost: costPerFootSai },
                      { method: "Current Workflow", cost: costPerFootOld },
                    ]}
                  />
                </VictoryChart>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center  text-xl flex-col sm:flex-row">
            <div className="w-1/2">
              Cost savings on this project enabled by SewerAI*
            </div>
            <div className="flex justify-center w-1/2">
              <Card
                white
                style={{ color: "#1f93c1", borderColor: "#1f93c1" }}
                className="text-xl p-4"
              >
                <CountUp
                  className="font-bold"
                  formattingFn={formatMoney}
                  end={profit}
                />
              </Card>
            </div>
          </div>
          <div className="flex justify-between items-center  text-xl flex-col sm:flex-row">
            <div className="w-1/2">
              Revenue from additional projects enabled from time gained on this
              project*
            </div>
            <div className="flex justify-center w-1/2">
              <Card
                white
                style={{ color: "#1f93c1", borderColor: "#1f93c1" }}
                className="text-xl p-4"
              >
                <CountUp
                  className="font-bold"
                  formattingFn={formatMoney}
                  end={additionalProfit}
                />
              </Card>
            </div>
          </div>
          <p className="text-center text-xs mb-2">* Includes SewerAI costs</p>
        </Card>
      )}
      <Card
        style={submitted ? { backgroundColor: "#c0f7a9cc" } : {}}
        className="text-center p-3"
      >
        {submitted && (
          <h1 className="text-xl sm:text-2xl">
            {" "}
            Thank you for your interest in SewerAI! One of our experts will be
            in touch with you shortly to learn more about your company, and the
            ways we can help you cut costs, increase productivity & accelerate
            your growth!
          </h1>
        )}
        {!submitted && (
          <>
            <h1 className="text-lg sm:text-xl">
              Interested in a customized analysis of your specific business or
              operational circumstances, or want to learn more about how SewerAI
              can enable you to earn more and grow more?
            </h1>
            <form
              onSubmit={handleSubmit(submitLogic)}
              className={`flex ${
                errors.email?.message ? "" : "items-center"
              } justify-center mt-3`}
            >
              <div className={`mr-4 flex flex-col items-center`}>
                <Controller
                  name="email"
                  as={Input}
                  control={control}
                  size="large"
                  placeholder="email"
                  type="email"
                  className={`${errors.email ? "border border-red-600" : ""}`}
                  rules={{
                    required: "Please enter an email",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Please enter a valid email address",
                    },
                  }}
                />
                <div className="text-red-600">
                  {errors.email && errors.email.message}
                </div>
              </div>
              <Button
                disabled={isSubmitting}
                onClick={handleSubmit(submitLogic)}
                size="large"
                type="primary"
              >
                Submit
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
};





