import  Component  from './base-component.js';
import { Validatable, validate } from '../utils/validation.js';
import { autobind } from '../decorators/autobind.js';
import { projectState } from '../state/project-state.js';

/////Project input aka form
export class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
	titleInputElement: HTMLInputElement;
	descriptionInputElement: HTMLInputElement;
	peopleInputElement: HTMLInputElement;
	constructor() {
		super('project-input', 'app', true, 'user-input');
		this.titleInputElement = this.element.querySelector('#title') as HTMLInputElement;
		this.descriptionInputElement = this.element.querySelector('#description') as HTMLInputElement;
		this.peopleInputElement = this.element.querySelector('#people') as HTMLInputElement;
		this.configure();
	}

	renderContent() {}

	configure() {
		this.element.addEventListener('submit', this.submitHandler);
	}

	private gatherUserInput(): [string, string, number] | void {
		const enteredTitle = this.titleInputElement.value;
		const enteredDesc = this.descriptionInputElement.value;
		const enteredPeople = this.peopleInputElement.value;

		const titleValidatable: Validatable = {
			value: enteredTitle,
			required: true,
		};
		const descValidatable: Validatable = {
			value: enteredDesc,
			required: true,
			minLength: 5,
		};
		const peopleValidatable: Validatable = {
			value: +enteredPeople,
			required: true,
			min: 1,
			max: 5,
		};

		if (!validate(titleValidatable) || !validate(descValidatable) || !validate(peopleValidatable)) {
			alert('Invalid input, please try again');
			return;
		}
		return [enteredTitle, enteredDesc, +enteredPeople];
	}

	private clearInputs() {
		this.titleInputElement.value = '';
		this.descriptionInputElement.value = '';
		this.peopleInputElement.value = '';
	}

	@autobind
	private submitHandler(event: Event) {
		event.preventDefault();
		const userInput = this.gatherUserInput();
		if (Array.isArray(userInput)) {
			const [title, desc, people] = userInput;
			projectState.addProject(title, desc, people);
			this.clearInputs();
		}
	}
}
