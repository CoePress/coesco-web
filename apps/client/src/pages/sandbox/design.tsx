import Button from "@/components/ui/button";
import Text from "@/components/ui/text";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import PageHeader from "@/components/common/page-head";

const Actions = () => {
  return (
    <div className="flex gap-2">
      <Button>Add</Button>
      <Button>Delete</Button>
    </div>
  );
};

const Design = () => {
  return (
    <div className="flex flex-col gap-2 flex-1">
      <PageHeader
        title="Sample Title"
        description="This is a sample description"
        actions={<Actions />}
        goBack
      />

      <div className="flex flex-col gap-2 flex-1">
        <div>
          <Text
            as="h3"
            className="mb-2">
            Buttons
          </Text>
          <div className="flex flex-wrap gap-2 items-center">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="primary-outline">Primary Outline</Button>
            <Button variant="secondary-outline">Secondary Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button disabled>Disabled</Button>
          </div>
        </div>

        <div>
          <Text
            as="h3"
            className="mb-2">
            Typography
          </Text>
          <div className="flex flex-wrap gap-2 items-center">
            <Text as="h1">Heading 1</Text>
            <Text as="h2">Heading 2</Text>
            <Text as="h3">Heading 3</Text>
            <Text as="h4">Heading 4</Text>
            <Text as="p">Paragraph</Text>
          </div>
        </div>

        <div>
          <Text
            as="h3"
            className="mb-2">
            Inputs
          </Text>
          <div className="flex flex-wrap gap-2">
            <Input
              label="Text Input"
              placeholder="Enter your name"
              required
              className="max-w-64"
            />
            <Input
              type="email"
              label="Email Input"
              placeholder="Enter your email"
              className="max-w-64"
            />

            <Input
              type="password"
              label="Password Input"
              placeholder="Enter your password"
              className="max-w-64"
            />

            <Input
              label="Disabled Input"
              placeholder="This is disabled"
              disabled
              className="max-w-64"
            />

            <Input
              label="Error Input"
              placeholder="Error state"
              value="Invalid value"
              error="This field is required"
              className="max-w-64"
            />

            <Select
              label="Select Input"
              placeholder="Choose an option"
              options={[
                { value: "option1", label: "Option 1" },
                { value: "option2", label: "Option 2" },
                { value: "option3", label: "Option 3" },
              ]}
              className="max-w-64"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Design;
