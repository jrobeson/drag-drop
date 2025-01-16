//Project Type
enum ProjectStatus {
	Active,
	Finished,
}

type Listener<T> = (items: T[]) => void;

class Project {
	constructor(public id: string, public title: string, public description: string, public people: number, public status: ProjectStatus) {}
}

////project State Management
class State<T> {
	protected listeners: Listener<T>[] = [];
	addListener(listenerFn: Listener<T>) {
		this.listeners.push(listenerFn);
	}
}

class ProjectState extends State<Project> {
	private projects: Project[] = [];
	private static instance: ProjectState;
	private constructor() {
		super();
	}
	static getInstance() {
		if (this.instance) {
			return this.instance;
		}
		this.instance = new ProjectState();
		return this.instance;
	}

	addProject(title: string, desc: string, people: number) {
		const newProject = new Project(Math.random().toString(), title, desc, people, ProjectStatus.Active);
		this.projects.push(newProject);
		for (const listener of this.listeners) {
			listener(this.projects.slice());
		}
	}
}

const projectState = ProjectState.getInstance();

///Validation
interface Validatable {
	value: string | number;
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	min?: number;
	max?: number;
}

function validate(validatableInput: Validatable): boolean {
	let isValid = true;
	if (validatableInput.required) {
		isValid = isValid && validatableInput.value.toString().trim().length !== 0;
	}
	if (validatableInput.minLength != null && typeof validatableInput.value === 'string') {
		isValid = isValid && validatableInput.value.length >= validatableInput.minLength;
	}
	if (validatableInput.maxLength != null && typeof validatableInput.value === 'string') {
		isValid = isValid && validatableInput.value.length <= validatableInput.maxLength;
	}
	if (validatableInput.min != null && typeof validatableInput.value === 'number') {
		isValid = isValid && validatableInput.value >= validatableInput.min;
	}
	if (validatableInput.max != null && typeof validatableInput.value === 'number') {
		isValid = isValid && validatableInput.value <= validatableInput.max;
	}
	return isValid;
}
/////

///autobind decorator
function autobind(_: any, _2: string, desc: PropertyDescriptor) {
	const originalMethod = desc.value;
	const adjDesc: PropertyDescriptor = {
		configurable: true,
		get() {
			const boundFn = originalMethod.bind(this);
			return boundFn;
		},
	};
	return adjDesc;
}
///

///Component Base Class
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
	templateElement: HTMLTemplateElement;
	hostElement: T;
	element: U;
	constructor(templateId: string, hostId: string, insertAtStart: boolean, newElementId?: string) {
		this.templateElement = document.getElementById(templateId)! as HTMLTemplateElement;
		this.hostElement = document.getElementById(hostId)! as T;
		const importedNode = document.importNode(this.templateElement.content, true);
		this.element = importedNode.firstElementChild as U;
		if (newElementId) {
			this.element.id = newElementId;
		}
		this.attach(insertAtStart);
	}

	private attach(insertAtBeginning: boolean) {
		this.hostElement.insertAdjacentElement(insertAtBeginning ? 'afterbegin' : 'beforeend', this.element);
	}

	abstract configure(): void;
	abstract renderContent(): void;
}

///// Project list
class ProjectList extends Component<HTMLDivElement, HTMLElement> {
	assignedProjects: Project[] = [];
	constructor(private type: 'active' | 'finished') {
		///super runs first and must, thats why we cant use this before super runs
		super('project-list', 'app', false, `${type}-projects`);
		///it is safer to call configure and renderContent in the inheritting class i.e. ProjectList
		//instead of the Component base class b/c the base class may call the methods in the inheritting class
		//before the inheriting classes constructor finishes setting up some things that confiure and render content may rely on
		//the may happen if called in the base class b/c as stated above super is always called first
		this.configure();
		this.renderContent();
	}

	configure() {
		projectState.addListener((projects: Project[]) => {
			const relevantProjects = projects.filter((prj) => {
				if (this.type === 'active') {
					return prj.status === ProjectStatus.Active;
				}
				return prj.status === ProjectStatus.Finished;
			});
			this.assignedProjects = relevantProjects;
			this.renderProjects();
		});
	}

	renderContent() {
		const listId = `${this.type}-projects-list`;
		this.element.querySelector('ul')!.id = listId;
		this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + ' PROJECTS';
	}

	private renderProjects() {
		const listElement = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement;
		listElement.innerHTML = '';
		for (const prjItem of this.assignedProjects) {
			const listItem = document.createElement('li');
			listItem.textContent = prjItem.title;
			listElement.appendChild(listItem);
		}
	}
}

/////Project input aka form
class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
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
			console.log(title, desc, people);
			projectState.addProject(title, desc, people);
			this.clearInputs();
		}
	}
}

const projInput = new ProjectInput();
const activeProjectList = new ProjectList('active');
const finishedProjectList = new ProjectList('finished');
