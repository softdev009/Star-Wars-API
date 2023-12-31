import { Component, Input, OnDestroy } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { CategoryService } from 'src/app/services/category.service';
import { SalesService } from 'src/app/services/sales.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent {
  private subscription: Subscription;
  buttonText: 'vehicles' | 'starships' = 'vehicles';

  @Input() totalPages: number = 1;
  products: any[] = [];
  pageCount = 10;
  currentPage = 1;
  isLoading = false;

  constructor(private apiService: ApiService, private router: Router, private route: ActivatedRoute,
    private categoryService: CategoryService, private salesService: SalesService) {
    this.subscription = this.categoryService.buttonText$.subscribe((text) => {
      this.buttonText = text;
      this.currentPage = 1;
      this.fetchProducts(this.currentPage, this.buttonText);
      this.router.navigate(['/products', this.currentPage, this.buttonText]);
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.currentPage = params['page'] || 1;
      this.buttonText = params['category'] || 'vehicles';
    });
    this.fetchProducts(this.currentPage, this.buttonText);
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  handleImageError(product: any) {
    product['imageUrl'] = 'assets/images/no_image.png';
  }

  nextPage() {
    this.currentPage = this.currentPage % this.totalPages + 1;
    this.router.navigate(['/products', this.currentPage, this.buttonText]);
    this.fetchProducts(this.currentPage, this.buttonText);
  }

  prevPage() {
    this.currentPage = (this.currentPage - 2 + this.totalPages) % this.totalPages + 1;
    this.router.navigate(['/products', this.currentPage, this.buttonText]);
    this.fetchProducts(this.currentPage, this.buttonText);
  }

  pageClicked(page: number) {
    this.currentPage = page;
    this.router.navigate(['/products', this.currentPage, this.buttonText]);
    this.fetchProducts(this.currentPage, this.buttonText);
  }

  fetchProducts(page: number, apiType: 'vehicles' | 'starships'): void {
    this.isLoading = true;
    this.apiService.getProducts(apiType, page).subscribe(
      (response) => {
        this.isLoading = false;
        this.products = response.results;
        this.totalPages = Math.ceil(response.count / this.pageCount);
        for (let i = 0; i < this.products.length; i++) {
          const url = this.products[i].url;
          const parts = url.split('/');
          const num = parts[parts.length - 2];

          this.products[i]['imageUrl'] = `assets/images/${this.buttonText}/${num}.jpg`;
          this.products[i]['sales'] = this.salesService.calculateSalePrice(this.products[i].url, this.products[i].cost_in_credits);
        }
      },
      (error) => {
        this.isLoading = false;
        console.error('Error fetching products:', error);
      }
    );
  }

  redirectToDetailPage(isLoading: boolean, product: any) {
    if (isLoading) return;
    this.router.navigate(['/detail', product.url, this.router.url]);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  updateButtonText(text: 'vehicles' | 'starships') {
    this.categoryService.setButtonText(text);
  }

  percentage(num: number) {
    return Math.floor(num);
  }
}
