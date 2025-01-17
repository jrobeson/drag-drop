import { autobind } from '../decorators/autobind';
import { Project, ProjectStatus } from '../models/project';
import { projectState } from '../state/project-state';
import  Component  from './base-component';
import { ProjectItem } from './project-item';
import { DragTarget } from '../models/drag-drop';

///// Project list
export class ProjectList extends Component<HTMLDivElement, HTMLElement> implements DragTarget {
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

	@autobind
	dragOverHandler(event: DragEvent): void {
		if (event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
			event.preventDefault();
			const listEl = this.element.querySelector('ul')!;
			listEl.classList.add('droppable');
		}
	}
	@autobind
	dropHandler(event: DragEvent): void {
		const prjId = event.dataTransfer!.getData('text/plain');
		projectState.moveProject(prjId, this.type === 'active' ? ProjectStatus.Active : ProjectStatus.Finished);
	}

	@autobind
	dragLeaveHandler(_: DragEvent): void {
		const listEl = this.element.querySelector('ul')!;
		listEl.classList.remove('droppable');
	}

	configure() {
		this.element.addEventListener('dragover', this.dragOverHandler);
		this.element.addEventListener('dragleave', this.dragLeaveHandler);
		this.element.addEventListener('drop', this.dropHandler);
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
			new ProjectItem(this.element.querySelector('ul')!.id, prjItem);
		}
	}
}
