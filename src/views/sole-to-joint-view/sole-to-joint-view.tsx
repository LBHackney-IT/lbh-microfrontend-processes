import { useParams } from "react-router-dom";

import { locale, processes } from "../../services";
import { CheckEligibilityView, SelectTenantsView } from "./states";

import { useProcess } from "@mtfh/common/lib/api/process/v1";
import {
  Center,
  ErrorSummary,
  Layout,
  Spinner,
  Step,
  Stepper,
} from "@mtfh/common/lib/components";

const { views } = locale;
const { soleToJoint } = views;

const steps = [
  <Step key="step-select-tenant">{soleToJoint.steps.selectTenant}</Step>,
  <Step key="step-personal-details">{soleToJoint.steps.checkEligibility}</Step>,
  <Step key="step-supporting-documents">{soleToJoint.steps.supportingDocuments}</Step>,
  <Step key="step-breach-of-tenure-check">{soleToJoint.steps.breachOfTenureCheck}</Step>,
  <Step key="step-tenure-investigation">{soleToJoint.steps.tenureInvestigation}</Step>,
  <Step key="step-housing-officer-review">{soleToJoint.steps.housingOfficerReview}</Step>,
];

const getActiveStep = (state: string, states) => {
  if (state === states.selectTenants.state) {
    return 0;
  }
  if (
    state === states.automatedChecksPassed.state ||
    state === states.automatedChecksFailed.state
  ) {
    return 1;
  }
  return 0;
};

const SideBar = ({ state, states }) => (
  <Stepper
    data-testid="mtfh-stepper-sole-to-joint"
    activeStep={getActiveStep(state, states)}
  >
    {steps}
  </Stepper>
);

export const SoleToJointView = () => {
  const { processId } = useParams<{ processId: string }>();

  const processConfig = processes.soletojoint;

  const { data: process, error } = useProcess({
    id: processId,
    processName: processConfig.processName,
  });

  if (error) {
    return (
      <ErrorSummary
        id="sole-to-joint-view"
        title={locale.errors.unableToFetchRecord}
        description={locale.errors.unableToFetchRecordDescription}
      />
    );
  }

  if (!process) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  const { currentState } = process;
  const { state } = currentState;

  const { states } = processConfig;
  const { selectTenants, automatedChecksFailed, automatedChecksPassed } = states;

  const components = {
    [selectTenants.state]: SelectTenantsView,
    [automatedChecksFailed.state]: CheckEligibilityView,
    [automatedChecksPassed.state]: CheckEligibilityView,
  };

  const Component = components[state];

  if (!Component) {
    return (
      <ErrorSummary
        id="sole-to-joint-view"
        title={locale.errors.unableToFindState}
        description={locale.errors.unableToFindStateDescription}
      />
    );
  }

  return (
    <Layout
      data-testid="soletojoint"
      sidePosition="right"
      side={<SideBar state={state} states={states} />}
    >
      <Component processConfig={processConfig} process={process} />
    </Layout>
  );
};
