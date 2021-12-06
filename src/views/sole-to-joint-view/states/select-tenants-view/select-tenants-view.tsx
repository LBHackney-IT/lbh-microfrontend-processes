import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import { Form, Formik } from "formik";
import * as Yup from "yup";

import { EntitySummary } from "../../../../components";
import { locale } from "../../../../services";
import { IProcess } from "../../../../types";

import { Process, editProcess } from "@mtfh/common/lib/api/process/v1";
import { useTenure } from "@mtfh/common/lib/api/tenure/v1";
import {
  Button,
  Center,
  ErrorSummary,
  FormGroup,
  Heading,
  InlineField,
  Layout,
  Link,
  Radio,
  RadioGroup,
  Spinner,
  StatusErrorSummary,
  Text,
} from "@mtfh/common/lib/components";

interface SelectTenantsViewProps {
  processConfig: IProcess;
  process: Process;
}

export const schema = Yup.object({
  tenant: Yup.string().required(),
});

export type FormData = Yup.Asserts<typeof schema>;

export const SelectTenantsView = ({ processConfig, process }: SelectTenantsViewProps) => {
  const stateConfig = processConfig.states.selectTenants;
  const { data: tenure, error } = useTenure(process.targetId);
  const [globalError, setGlobalError] = useState<number>();

  if (error) {
    return (
      <ErrorSummary
        id="select-tenants-view"
        title={locale.errors.unableToFetchRecord}
        description={locale.errors.unableToFetchRecordDescription}
      />
    );
  }

  if (!tenure) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  const SideBar = () => null;

  return (
    <Layout
      data-testid="soletojoint-SelectTenants"
      sidePosition="right"
      side={<SideBar />}
    >
      <Heading variant="h1">{processConfig.title}</Heading>
      <EntitySummary id={process.targetId} type={processConfig.targetType} />
      {globalError && (
        <StatusErrorSummary id="select-tenant-global-error" code={globalError} />
      )}
      <Formik<FormData>
        initialValues={{ tenant: "" }}
        validateOnChange
        validateOnBlur={false}
        validationSchema={schema}
        onSubmit={async () => {
          try {
            await editProcess({
              id: process.id,
              processTrigger: processConfig.states.checkEligibility.stateName,
              processName: process?.processName,
              etag: process.etag || "",
              formData: {},
              documents: [],
            });
          } catch (e: any) {
            setGlobalError(e.response?.status || 500);
          }
        }}
      >
        {(properties) => (
          <Form>
            <FormGroup
              id="select-tenant"
              name="tenant"
              label={stateConfig.selectTenantLabel}
              required
              hint={stateConfig.selectTenantHint}
            >
              <RadioGroup>
                {tenure.householdMembers.map((householdMember, index) => (
                  <InlineField key={index} name="tenant" type="radio">
                    <Radio
                      id={`select-tenant-${householdMember.id}`}
                      value={householdMember.id}
                    >
                      {householdMember.fullName}
                    </Radio>
                  </InlineField>
                ))}
              </RadioGroup>
            </FormGroup>
            <Text>
              {stateConfig.addToTenureText}
              <Link
                as={RouterLink}
                to={`/tenure/${process.targetId}/edit/person`}
                isExternal
              >
                {stateConfig.addToTenureLink}
              </Link>
              .
            </Text>
            <div className="start-process__actions">
              <Button
                disabled={!properties.dirty || !properties.isValid}
                isLoading={properties.isSubmitting}
                loadingText={locale.loadingText}
                type="submit"
              >
                {locale.next}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};
